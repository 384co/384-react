import * as React from "react"
import * as __ from "lib384/dist/384.esm"
import { useSnackabra } from '../SnackabraContext/SnackabraContext';
import { ChannelStore } from "../../stores/ChannelStore/Channel.Store";
import { SnackabraProviderProps, SBFileHelperContextContextType } from "./SBFileHelperContext.d";


const SBFileHelperContext = React.createContext<SBFileHelperContextContextType>({
  fileHelper: null,
  knownShards: new Map(),
  ignoreProcessing: new Map(),
  uploadFile: async () => { return null },
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

export function SBFileHelperProvider({ children, config }: SnackabraProviderProps) {
  const SB = useSnackabra()
  let toUpload = React.useRef<string[]>([])
  let uploaded = React.useRef<string[]>([])
  const SBFileSystem = new __.file.fs(config);
  const [fileHelper, setFileHelper] = React.useState<any>(null)
  const [knownShards] = React.useState<Map<string, string>>(new Map())
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
    knownShards.set(message.shardId, message.handle)
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

  const download = (handle: any): Promise<ArrayBuffer> => {
    const sbServer = new __.Snackabra(config)
    return sbServer.storage.fetchData(handle)
  }
  console.log(knownShards)
  return (
    <SBFileHelperContext.Provider value={{
      fileHelper: fileHelper,
      knownShards: knownShards,
      ignoreProcessing: ignoreProcessing,
      uploadFile: uploadFile,
      uploadConfirmed: uploadConfirmed,
      progress: progress,
      download: download
    }}>
      {fileHelper !== null ?
        children

        :
        null}
    </SBFileHelperContext.Provider>
  )

};

export default SBFileHelperContext;