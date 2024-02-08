import * as React from "react"
import { observer } from "mobx-react";
import * as __ from "lib384/dist/384.esm"
import { useSnackabra } from '../SnackabraContext/SnackabraContext';
import { ChannelStore } from "../../stores/ChannelStore/Channel.Store";
import { SnackabraProviderProps, SBFileHelperContextContextType } from "./SBFileHelperContext.d";


const SBFileHelperContext = React.createContext<SBFileHelperContextContextType>({
  fileHelper: null,
  knownShards: new Map(),
  ignoreProcessing: new Map(),
  uploadFile: async () => { return null },
  removeFile: () => { },
  uploadConfirmed: () => { },
  download: async () => { return new ArrayBuffer(0) },
  progress: 0
});

export const useSBFH = () => {
  const context = React.useContext(SBFileHelperContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export const SBFileHelperProvider = observer(({ children, config }: SnackabraProviderProps) => {
  const SB = useSnackabra()
  let toUpload = React.useRef<string[]>([])
  let uploaded = React.useRef<string[]>([])
  let knownShards = React.useRef<Map<string, any>>(new Map());
  const SBFileSystem = new __.file.fs(config);
  const [fileHelper, setFileHelper] = React.useState<any>(null)
  const [ignoreProcessing] = React.useState<Map<string, string>>(new Map())
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const fh = new __.browser.files()
    setFileHelper(fh)
  }, [config])

  const removeFile = (uniqueShardId: string) => {
    for (const [key, value] of fileHelper.finalFileList.entries()) {
      if (value.uniqueShardId === uniqueShardId) {
        try {
          fileHelper.globalBufferMap.delete(value.uniqueShardId)
          fileHelper.finalFileList.delete(key)
        } catch (e) {
          console.warn(e)
        }

      }
    }
  }

  const uploadConfirmed = (message: { shardId: string, handle: any }) => {
    if (!SB) throw new Error('SB is null')
    if (toUpload.current.length > 0) {
      if (toUpload.current.includes(message.shardId)) {
        uploaded.current.push(message.shardId)
        setTimeout(() => {
          setProgress(Math.ceil(uploaded.current.length / toUpload.current.length * 100));
        }, 250 * uploaded.current.length)
      }
    }
    if (uploaded.current.length === toUpload.current.length) {
      resetUpload()
    }
    knownShards.current.set(message.shardId, message.handle)
  }

  const resetUpload = () => {
    toUpload.current = []
    uploaded.current = []
  }
  //SBFileSystem.uploadBuffer
  const uploadFile = async (fileHash: string, messageType: string, channel: ChannelStore) => {
    if (!SB) throw new Error('SB is null')
    for (const [key, value] of fileHelper.finalFileList.entries()) {
      console.log(fileHash)
      console.log(key, value)
      if (fileHash === value.uniqueShardId) {
        if (knownShards.current.has(fileHash)) return true;
        console.log(`---- uploading file ${key} with hash ${fileHash} ...`)
        const buffer = fileHelper.globalBufferMap.get(fileHash)
        if (!buffer) throw new Error(`**** failed to find buffer for ${fileHash} (should not happen)`)
        console.log(buffer)
        toUpload.current.push(fileHash)
        const handle = await SBFileSystem.uploadBuffer(channel.id, buffer)
        console.log('key', key)
        console.log('value', value)
        const contents: any = {
          text: JSON.stringify({
            createdAt: new Date(),
            messageType: messageType,
            user: SB.store!.getContact(channel.key),
            sender_username: SB.store!.getContact(channel.key).name,
            shardId: value.uniqueShardId,
            mimeType: value.type,
            sbFile: value,
            handle: handle,
          })
        }

        channel.sendMessage(contents)
        removeFile(fileHash)
        return true;
      }
    }
    return false;
  }

  function downloadFile(arrayBuffer: ArrayBuffer, handle: any) {
    // Create a Blob from the ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: handle.mimeType });
  
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = handle.name;

    // Trigger the click event to start the download
    downloadLink.click();

    // Cleanup the URL object
    window.URL.revokeObjectURL(downloadLink.href);
  }

  const download = async (handle: any, performDownload: boolean = false): Promise<ArrayBuffer> => {
    const sbServer = new __.Snackabra(config)
    let fileAb = await sbServer.storage.fetchData(handle);
    console.log(handle)
    if(performDownload){
      downloadFile(fileAb, handle)
    }
    return fileAb
  }
  return (
    <SBFileHelperContext.Provider value={{
      fileHelper: fileHelper,
      knownShards: knownShards.current,
      ignoreProcessing: ignoreProcessing,
      uploadFile: uploadFile,
      uploadConfirmed: uploadConfirmed,
      progress: progress,
      download: download,
      removeFile: removeFile
    }}>
      {fileHelper !== null ?
        children

        :
        null}
    </SBFileHelperContext.Provider>
  )

});

export default SBFileHelperContext;