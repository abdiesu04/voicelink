import { randomUUID } from "crypto";

export interface Room {
  id: string;
  creatorLanguage: string;
  participantLanguage?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface IStorage {
  createRoom(language: string): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  async createRoom(language: string): Promise<Room> {
    const id = randomUUID();
    const room: Room = {
      id,
      creatorLanguage: language,
      createdAt: new Date(),
      isActive: true,
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updated = { ...room, ...data };
    this.rooms.set(id, updated);
    return updated;
  }

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id);
  }
}

export const storage = new MemStorage();
