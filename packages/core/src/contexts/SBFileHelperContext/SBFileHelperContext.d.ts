import React from 'react'
import { SnackabraTypes } from "lib384/dist/384.esm"
import ChannelStore from 'src/stores/ChannelStore/Channel.Store'

export interface SnackabraProviderProps extends React.PropsWithChildren<{}> {
  config: SnackabraTypes.SBServer
  children?: React.ReactNode
}

export interface SBFileHelperContextContextType {
  fileHelper: any
  knownShards: Map<string, string>
  ignoreProcessing: Map<string, string>
  uploadFile: (fileHash: string, messageType: string, channel: ChannelStore) => Promise<any>
  removeFile: (fileHash: string) => void
  uploadConfirmed: (message: { shardId: string, handle: any }) => void
  download: (handle: any) => Promise<ArrayBuffer>
  progress: number
}