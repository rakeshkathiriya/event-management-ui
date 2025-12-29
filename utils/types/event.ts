export interface CreateEventPayload {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}

export interface EventData {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
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
}

export interface GetNearestEventResponse {
  success: boolean;
  data: EventData;
}

export interface GetAllEventsResponse {
  success: boolean;
  data: EventData[];
}
