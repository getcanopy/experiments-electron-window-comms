// OurMessage, topics, etc are all arbitrary props for poc
export interface OurMessage{
  topic: "message" | "create-child" | "destroy-child";
  body?: any;
  from?: string;
  url?: string
}
