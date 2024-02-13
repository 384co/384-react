import React from 'react'
import { DropZone } from "@384/components"
import { Button, Chip, Grid, IconButton, Paper, Typography, useTheme } from "@mui/material"
import { useSBFH, useVault, useSnackabra } from '@384/core';
import DownloadIcon from '@mui/icons-material/Download';




const DropZoneTest = () => {
    const theme = useTheme();
    const SBFH = useSBFH();
    const vault = useVault();
    const SB = useSnackabra();
    const [files, setFiles] = React.useState<any[]>([])
    const [channel, setChannel] = React.useState<any>({})

    React.useEffect(() => {
        if(vault.id){
            connect()
        }

    }, [vault.id])

    React.useEffect(() => {
        if(channel){
            console.log('channel', channel.messages)
        }
    }, [channel.messages])

    const connect = async () => {
        await SB.store.ready
        console.log('vault', vault.id)
        const channel = SB.store!.channels[vault.id]
        console.log('channel', channel)
        setChannel(await channel.connect())
    }

    const uploadFiles = (): void => {
        const fileUploadPromises: Promise<boolean>[] = []
        for (const [key, value] of SBFH.fileHelper.finalFileList.entries()) {
            console.log('value', JSON.stringify(value))
            fileUploadPromises.push(SBFH.uploadFile(value.uniqueShardId, 'FILE_UPLOAD', channel))

        }
        Promise.all(fileUploadPromises).then((values) => {
            alert('All files uploaded')
          })

    }

    const parseFiles = () => {
        for (const [key, value] of SBFH.fileHelper.finalFileList.entries()) {
            console.log('value', JSON.stringify(value))
            setFiles([...files, value])
        }
    }

    const removeFile = (file: any) => {
        SBFH.removeFile(file.uniqueShardId)
        const _files = files.filter((f) => f !== file)
        setFiles(_files)
    }

    const download = async (file: any) => {
        const knownShard = SBFH.knownShards.get(file.uniqueShardId)
        console.log(knownShard)
        let handle = knownShard.handle
        handle.mimeType = file.type
        handle.name = file.name
        console.log(handle, file)
        return await SBFH.download(handle, true)
    }

    return (
        <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems={'flex-start'}
        sx={{
          height: '100vh',
        }}
      >

            <Grid xs={6} item>
                <Paper sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
                    <Button onClick={uploadFiles}>Upload Files</Button>
                    <Grid xs={12} sx={{p:2}} item>
                        <Grid container direction="row" justifyContent="flex-start" alignItems="center" spacing={2}>
                            {files.map((file, index) => {
                                return (
                                    <Chip
                                    key={index}
                                    avatar={!SBFH.knownShards.has(file.uniqueShardId) ? <IconButton onClick={() => { download(file) }}>
                                        <DownloadIcon />
                                    </IconButton> : <></>}
                                    label={file.name}
                                    onDelete={() => { removeFile(file) }}
                                    sx={{ mr: 2 }}
                                />
                                )
                            })
                            }
                        </Grid>
                    </Grid>
                    <DropZone
                        id={'dropzone'}
                        accept={{ '*/*': [] }}
                        onDrop={parseFiles}
                    >
                        <Typography align='center'
                            justifyContent={'center'}
                            variant="h5"
                            sx={{
                                color: '#5b627e',
                                fontWeight: 600,
                                padding: 2,
                                width: '100%',
                                height: 64,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            Drop Items Here
                        </Typography>
                    </DropZone>
                </Paper>
            </Grid>

        </Grid>
    )
}

export default DropZoneTest