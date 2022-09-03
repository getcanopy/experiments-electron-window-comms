import { contextBridge, ipcRenderer }  from "electron"
export interface Communicator{
  createChild(args:any): Promise<MessagePort>
}

export const canCommunicate = "yes"
