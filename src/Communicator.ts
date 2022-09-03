export interface Communicator{
  createChild(args:any): Promise<MessagePort>
}
