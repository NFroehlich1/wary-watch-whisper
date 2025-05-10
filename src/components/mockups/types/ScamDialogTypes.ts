
import { ScamResult } from '@/types';

export interface Message {
  id: string;
  sender: 'me' | 'bot';
  text: string;
  timestamp: Date;
  scenario?: string;
}

export interface ScamAlert {
  id: string;
  content: string;
  result: ScamResult;
}

export interface ScenarioMessage {
  text: string;
  scenario: string;
}
