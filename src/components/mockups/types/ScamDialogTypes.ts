
import { ScamResult } from '@/types';

export interface Message {
  id: string;
  sender: 'me' | 'bot';
  text: string;
  timestamp: Date;
  scenario?: string;
  isNew?: boolean;
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

export type ScenarioType = 'investment' | 'banking' | 'gift' | 'tech' | 'romance';
