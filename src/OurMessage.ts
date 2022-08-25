export type OurMessage = {
  topic: 'message' | 'create-child' | 'destroy-child';
  body: any;
};
