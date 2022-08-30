export interface Communicator{
  createChild({name, url}): Promise<MessagePort>
}
