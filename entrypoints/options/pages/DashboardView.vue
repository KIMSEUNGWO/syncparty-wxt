<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storageManager } from '@/core/StorageManager'

const isLoggedIn = ref(false)
const userInfo = ref<{
  nickname: string
  profile: string
  email: string
} | null>(null)

// 로그인 상태 확인
onMounted(async () => {
  const authData = await storageManager.getItems(['auth:accessToken', 'auth:nickname', 'auth:email', 'auth:profile'])
  if (authData['auth:accessToken']) {
    isLoggedIn.value = true
    userInfo.value = {
      nickname: authData['auth:nickname'],
      email: authData['auth:email'],
      profile: authData['auth:profile'],
    }
  }

  // postMessage 리스너 등록
  window.addEventListener('message', handleOAuthMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleOAuthMessage)
})

// OAuth 성공 메시지 처리
const handleOAuthMessage = async (event: MessageEvent) => {
  // 보안: 올바른 origin인지 확인 (개발 환경)
  if (event.origin !== 'http://localhost:8080') {
    console.warn('Received message from unknown origin:', event.origin)
    return
  }

  if (event.data.type === 'OAUTH_SUCCESS') {
    console.log('OAuth success message received:', event.data)

    // 토큰과 사용자 정보 저장
    await storageManager.setItems({
      'auth:accessToken': event.data.accessToken,
      'auth:refreshToken': event.data.refreshToken,
      'auth:nickname': event.data.nickname,
      'auth:profile': event.data.profile,
      'auth:email': event.data.email,
    })

    // 상태 업데이트
    isLoggedIn.value = true
    userInfo.value = {
      nickname: event.data.nickname,
      email: event.data.email,
      profile: event.data.profile
    }

    console.log('Auth data saved to storage')
  }
}

// 구글 로그인 (팝업)
const loginWithGoogle = () => {
  const width = 600
  const height = 700
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2

  window.open(
    'http://localhost:8080/oauth2/authorization/google',
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top}`
  )
}

// 로그아웃
const logout = async () => {
  await storageManager.removeItem('auth:accessToken')
  await storageManager.removeItem('auth:refreshToken')
  await storageManager.removeItem('auth:userId')
  await storageManager.removeItem('auth:username')

  isLoggedIn.value = false
  userInfo.value = null
}
</script>

<template>
  <div class="dashboard-container">
    <h1>Dashboard</h1>

    <!-- 로그인 전 -->
    <div v-if="!isLoggedIn" class="login-section">
      <p>확장프로그램을 사용하려면 로그인이 필요합니다.</p>
      <button @click="loginWithGoogle" class="google-login-btn">
        구글로 로그인
      </button>
    </div>

    <!-- 로그인 후 -->
    <div v-else class="user-section">
      <h2>환영합니다, {{ userInfo?.nickname }}님!</h2>
      <p>Enail: {{ userInfo?.email }}</p>
      <button @click="logout" class="logout-btn">
        로그아웃
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 30px;
  color: #646cff;
}

.login-section,
.user-section {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
}

.login-section p {
  font-size: 1.1em;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.8);
}

.google-login-btn {
  background: #4285f4;
  color: white;
  border: none;
  padding: 16px 48px;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 600;
}

.google-login-btn:hover {
  background: #357ae8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
}

.user-section {
  text-align: left;
}

.user-section h2 {
  color: #646cff;
  margin-bottom: 20px;
}

.user-section p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 30px;
}

.logout-btn {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  font-size: 0.95em;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.87);
}
</style>