import { authService } from '@/services/AuthService';
import { RoomResponse } from "@/components/dto/RoomResponse";

const API_BASE_URL = '/api';

export const roomController = {
    async createRoom(hostId: string, url: string): Promise<RoomResponse> {
        const axios = authService.getAxiosInstance();
        const response = await axios.post(`${API_BASE_URL}/rooms/create`, { hostId, url });
        return response.data;
    },

    async getRoomByCode(inviteCode: string): Promise<RoomResponse> {
        const axios = authService.getAxiosInstance();
        const response = await axios.get(`${API_BASE_URL}/rooms/${inviteCode}`);
        return response.data;
    }
};
