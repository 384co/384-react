import React, { DragEvent } from 'react'
//@ts-ignore
import { isEvtWithFiles, allFilesAccepted, acceptPropAsAcceptAttr } from 'react-dropzone/dist/es/utils/index.js'
import Dropzone from 'react-dropzone'
import { DropZoneProps } from './DropZone.d'
import { Grid } from "@mui/material";
import { isMobile } from 'react-device-detect';
import { fromEvent } from "file-selector";
import { useSBFH } from '@384/core';


const DropZoneComponent = (props: DropZoneProps) => {
  const SBFH = useSBFH();
  const { children, dzRef, styles = {} } = props;
  const [success, setSuccess] = React.useState(false)
  const [dragAccept, setDragAccept] = React.useState(false)
  const [draggReject, setDragReject] = React.useState(false)
  const elementId = `${props.id}`
  let maxFiles = isMobile ? 5 : 10

  let baseStyle = {
    flex: 1,
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'solid',
    backgroundColor: '##fff',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
  }

  let focusedStyle = {
    borderColor: '#2196f3',
  }

  let acceptStyle = {
    borderColor: '#00e676',
  }

  let rejectStyle = {
    borderColor: '#ff1744',
  }

  React.useEffect(() => {
    if (success) {
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    }
  }, [success])


  const onDrop = () => {
    if (props.onDrop) {
      props.onDrop()
    }

  }

  const onRejected = (e: any) => {
    switch (e[0].errors[0].code) {
      case 'too-many-files':
        // notify(`Too many files attached, maximum limit is ${maxFiles}`, 'error')
        console.error('Too many files attached');
        break;
      case 'file-invalid-type':
        // notify('Invalid file type', 'error')
        console.error('Invalid file type');
        break;
      case 'file-too-large':
        // notify('File is too large', 'error')
        console.error('File is too large');
        break;
      default:
        console.error(e[0].errors);
        // notify('There was an issue attaching your files', 'error');
        break;
    }
    setTimeout(() => {
      console.log('resetting')
      setDragAccept(false)
      setDragReject(false)
    }, 2000)
  }

  const onError = (e: Error) => {
    console.error(e);
    if (props.onError) {
      props.onError(e)
    }

  }

  const onDragEnter = (event: DragEvent) => {
    if (isEvtWithFiles(event)) {
      Promise.resolve(fromEvent(event)).then(function (files) {

        var fileCount = files.length;
        var isDragAccept = fileCount > 0 && allFilesAccepted({
          files: files,
          accept: acceptPropAsAcceptAttr(props.accept),
          minSize: 0,
          maxSize: Infinity,
          multiple: true,
          maxFiles: maxFiles,
          validator: null
        });
        var isDragReject = fileCount > 0 && !isDragAccept;
        setDragAccept(isDragAccept)
        setDragReject(isDragReject)
        console.log('dragrefjectedornot', {
          isDragAccept: isDragAccept,
          isDragReject: isDragReject,
          isDragActive: true,
          type: "setDraggedFiles"
        });

        // if (onDragEnter) {
        //   onDragEnter(event);
        // }
      }).catch(function (e) {
        console.error(e);
      });
    }
  }
  const onDragLeave = () => {
    setDragAccept(false)
    setDragReject(false)
  }

  /**
   * Parses files from a FileSystemHandle event
   * @param e
   * @returns 
   */
  const getFilesFromFileSystemHandle = async (e: any) => {
    let files = []
    let mockEvent = {
      preventDefault: () => { console.log('preventDefault') },
      target: {
        files: []
      }
    }
    for (let x in e) {
      const file: any = await e[x].getFile()
      files.push(file)
      //@ts-ignore
      mockEvent.target.files.push(file)
    }
    console.log(files)
    // eslint-disable-next-line no-undef
    SBFH.fileHelper.handleFileDrop(mockEvent, onDrop);
    return files
  }


  // We use this to get the raw drop event so we can use SBFileHelper to upload the files
  const eventHandler = (e: any): any => {
    console.log('eventHandler', e)
    console.log(Object.assign({}, e))
    if (e.type === 'dragenter') {
      return true;
    }

    const files = [];
    // eslint-disable-next-line no-undef
    console.log((dragAccept && !draggReject) || e[0] instanceof FileSystemHandle || e?.type === 'change')
    // eslint-disable-next-line no-undef
    if ((dragAccept && !draggReject) || e[0] instanceof FileSystemHandle || e?.type === 'change') {
      // eslint-disable-next-line no-undef
      if (e[0] instanceof FileSystemHandle) {

        return getFilesFromFileSystemHandle(e);
      } else {
        const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        if (e.type === 'drop' || e.type === 'change') {
          for (var i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);
            files.push(file);

          }
          // eslint-disable-next-line no-undef
          SBFH.fileHelper.handleFileDrop(e.nativeEvent, onDrop);
        }
      }
    } else {
      const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
      if (e.type === 'drop' || e.type === 'change') {
        for (var x = 0; x < fileList.length; x++) {
          const file = fileList.item(x);
          files.push(file);

        }
      }
    }
    console.log('files', files)
    onDragLeave()
    return files;

  }


  //This is where we would want to do something with the files when they are uploaded
  //https://mozilla.github.io/pdf.js/examples/
  // const onDropZone = useCallback(onDropCallback, [previewOpen, selectFiles])


  return (
    <Dropzone
      maxSize={20 * 1024 * 1024} // 20MB
      ref={dzRef} onDropRejected={onRejected} onError={onError} noClick={props.noClick} noKeyboard accept={props.accept} maxFiles={props.maxFiles ?? 20} getFilesFromEvent={eventHandler} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>

      {({ getRootProps, getInputProps, isFocused }: { getRootProps: CallableFunction, getInputProps: CallableFunction, isFocused: boolean }) => {

        // focusedStyle = Object.assign({}, focusedStyle, props.focusedStyle)
        // acceptStyle = Object.assign({}, acceptStyle, props.acceptStyle)
        // rejectStyle = Object.assign({}, rejectStyle, props.rejectStyle)
        const _style = {
          ...{ ...baseStyle, ...styles },
          ...(isFocused ? focusedStyle : {}),
          ...(dragAccept ? acceptStyle : {}),
          ...(draggReject ? rejectStyle : {}),
        }
        return (
          <Grid {...getRootProps({ _style })}
            id={elementId}
            container
            direction="row"
            justifyContent="center"
            alignItems="center">
            <input {...getInputProps()} />
            {children}
          </Grid>
        );
      }}
    </Dropzone>

  )


}

export { DropZoneComponent }
