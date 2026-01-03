import axios from 'axios';
import {RoomResponse} from "@/components/dto/RoomResponse";

const API_BASE_URL = 'http://localhost:8080/api';

export const roomController = {
    async createRoom(hostId: string, url: string): Promise<RoomResponse> {
        const response = await axios.post(`${API_BASE_URL}/rooms/create`, { hostId, url });
        return response.data;
    },

    async getRoomByCode(inviteCode: string): Promise<RoomResponse> {
        const response = await axios.get(`${API_BASE_URL}/rooms/${inviteCode}`);
        return response.data;
    }
};
