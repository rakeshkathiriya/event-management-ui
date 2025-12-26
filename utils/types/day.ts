export interface AddProgramToDayPayload {
  programId: string;
}

export interface AddProgramToDayParams {
  dayId: string;
  payload: AddProgramToDayPayload;
}
