// day.ts

export interface AddProgramToDayPayload {
  programIds: string[];
}

export interface AddProgramToDayParams {
  dayId: string;
  payload: AddProgramToDayPayload;
}
