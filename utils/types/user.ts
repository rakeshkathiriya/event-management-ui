export interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: "User" | "Admin";
  departments?: {
    _id: string;
    name: string;
  }[];
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
  };
}

// My Assignments Types
export interface ProgramAssignment {
  programId: string;
  programTitle: string;
  programDescription?: string;
  departmentName: string;
}

export interface DayAssignment {
  dayId: string;
  dayNumber: number;
  date: string;
  programs: ProgramAssignment[];
}

export interface EventAssignment {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  eventStartDate: string;
  days: DayAssignment[];
}

export interface MyAssignmentsResponse {
  success: boolean;
  data: {
    events: EventAssignment[];
  };
}
