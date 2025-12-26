export interface CreateEventPayload {
  title: string;
  description?: string;
  startDate: Date;
  totalDays: number;
}

export interface GetNearestEventResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    totalDays: number;
    days: Array<{
      _id: string;
      date: string;
      programs: Array<{
        _id: string;
        title: string;
        departments: Array<{
          _id: string;
          name: string;
          users: Array<{
            _id: string;
            name: string;
          }>;
        }>;
      }>;
    }>;
  };
}
