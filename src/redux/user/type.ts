export interface UOG_DATA_TYPE {
  successLogs: SUCCESS_LOGS[];
  unknownLogs: UNKNOWN_LOGS[];
  users: USERS[];
}

export interface VU_STUDY_DATA_TYPE {
  success: boolean;
  users: VUSTUDY_USERS[];
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
interface VUSTUDY_USERS {
  app_version: string;
  brand: string;
  created_at: string;
  device_id: string;
  device_model: string;
  device_name: string;
  first_opened_at: string;
  last_seen_at: string;
  os_version: number;
  platform: string;
  updated_at: string;
  user_id: string;
  username: string;
}
