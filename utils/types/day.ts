// day.ts

export interface AddProgramToDayPayload {
  programIds: string[];
}

export interface AddProgramToDayParams {
  dayId: string;
  payload: AddProgramToDayPayload;
}

export interface ReorderProgramsInDayPayload {
  programIds: string[];
}

export interface ReorderProgramsInDayParams {
  dayId: string;
  payload: ReorderProgramsInDayPayload;
}
