export interface UOG_DATA_TYPE {
  successLogs: SUCCESS_LOGS[];
  unknownLogs: UNKNOWN_LOGS[];
  users: USERS[];
}

interface USERS {
  App_Version: string;
  Device_Model: string;
  Hardware_ID: string;
  Last_Seen: string;
  Name: string;
  Platform: string;
  Timestamp: string;
}

interface SUCCESS_LOGS {
  App_Version: string;
  Bot_Response: string;
  Device_Model: string;
  Hardware_ID: string;
  ISSUE: string;
  Name: string;
  Platform: string;
  Question: string;
  Timestamp: string;
  Validation: string;
}

interface UNKNOWN_LOGS {
  App_Version: string;
  Device_Model: string;
  Hardware_ID: string;
  Name: string;
  Platform: string;
  Question: string;
  Timestamp: string;
  comments: string;
}
