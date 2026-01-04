import { storageManager } from '@/core/StorageManager'
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

/**
 * 인증 정보 타입
 */
export interface AuthData {
  accessToken: string
  refreshToken: string
  nickname: string
  email: string
  profile: string
}

/**
 * 인증 서비스
 * - JWT 토큰 관리
 * - API 호출 시 자동으로 Authorization 헤더 추가
 * - 토큰 갱신 처리
 */
export class AuthService {
  private static instance: AuthService
  private axiosInstance: AxiosInstance

  private constructor() {
    // Axios 인스턴스 생성
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:8080',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request 인터셉터: 자동으로 Authorization 헤더 추가
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const accessToken = await this.getAccessToken()
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response 인터셉터: 401 에러 시 토큰 갱신 시도
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // 401 에러이고 아직 재시도하지 않았다면
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // 토큰 갱신 시도
            const newAccessToken = await this.refreshAccessToken()
            if (newAccessToken) {
              // 새 토큰으로 재시도
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              return this.axiosInstance(originalRequest)
            }
          } catch (refreshError) {
            // 토큰 갱신 실패 시 로그아웃 처리
            await this.logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Axios 인스턴스 반환 (API 호출용)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }

  /**
   * 로그인 상태 확인
   */
  public async isLoggedIn(): Promise<boolean> {
    const accessToken = await this.getAccessToken()
    return !!accessToken
  }

  /**
   * 인증 데이터 저장
   */
  public async saveAuthData(authData: AuthData): Promise<void> {
    await storageManager.setItems({
      'auth:accessToken': authData.accessToken,
      'auth:refreshToken': authData.refreshToken,
      'auth:nickname': authData.nickname,
      'auth:profile': authData.profile,
      'auth:email': authData.email,
    })
  }

  /**
   * 인증 데이터 전체 조회
   */
  public async getAuthData(): Promise<AuthData | null> {
    const data = await storageManager.getItems([
      'auth:accessToken',
      'auth:refreshToken',
      'auth:userId',
      'auth:username',
    ])

    if (!data['auth:accessToken']) {
      return null
    }

    return {
      accessToken: data['auth:accessToken'],
      refreshToken: data['auth:refreshToken'],
      email: data['auth:email'],
      profile: data['auth:profile'],
      nickname: data['auth:nickname'],
    }
  }

  /**
   * Access Token 조회
   */
  public async getAccessToken(): Promise<string | null> {
    return await storageManager.getItem<string>('auth:accessToken')
  }

  /**
   * Refresh Token 조회
   */
  public async getRefreshToken(): Promise<string | null> {
    return await storageManager.getItem<string>('auth:refreshToken')
  }

  /**
   * 사용자 닉네임 조회
   */
  public async getNickname(): Promise<string | null> {
    return await storageManager.getItem<string>('auth:nickname')
  }

  /**
   * 사용자 이메일 조회
   */
  public async getEmail(): Promise<string | null> {
    return await storageManager.getItem<string>('auth:email')
  }
  /**
   * 사용자 프로필 URL 조회
   */
  public async getProfile(): Promise<string | null> {
    return await storageManager.getItem<string>('auth:profile')
  }

  /**
   * Access Token 갱신
   */
  public async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Refresh Token을 사용하여 새 Access Token 발급
      const response = await axios.post(
        'http://localhost:8080/auth/refresh',
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      )

      const newAccessToken = response.data.accessToken
      await storageManager.setItem('auth:accessToken', newAccessToken)

      console.log('[AuthService] Access token refreshed successfully')
      return newAccessToken
    } catch (error) {
      console.error('[AuthService] Failed to refresh access token:', error)
      throw error
    }
  }

  /**
   * 로그아웃
   */
  public async logout(): Promise<void> {
    await storageManager.removeItem('auth:accessToken')
    await storageManager.removeItem('auth:refreshToken')
    await storageManager.removeItem('auth:nickname')
    await storageManager.removeItem('auth:profile')
    await storageManager.removeItem('auth:email')

    console.log('[AuthService] Logged out')
  }

  /**
   * 사용자 프로필 조회 (예시)
   */
  public async getUserProfile(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/api/user/profile')
      return response.data
    } catch (error) {
      console.error('[AuthService] Failed to get user profile:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const authService = AuthService.getInstance()