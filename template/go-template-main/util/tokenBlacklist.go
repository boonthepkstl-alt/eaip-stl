package util

import (
	"sync"
	"time"
)

type blacklistStore struct {
	mu      sync.RWMutex
	entries map[string]int64
}

var tokenBlacklist = &blacklistStore{entries: make(map[string]int64)}

func BlacklistToken(jti string, expiry int64) {
	tokenBlacklist.mu.Lock()
	defer tokenBlacklist.mu.Unlock()
	tokenBlacklist.entries[jti] = expiry
}

func IsTokenBlacklisted(jti string) bool {
	tokenBlacklist.mu.RLock()
	defer tokenBlacklist.mu.RUnlock()
	_, ok := tokenBlacklist.entries[jti]
	return ok
}

func cleanupBlacklist() {
	tokenBlacklist.mu.Lock()
	defer tokenBlacklist.mu.Unlock()
	now := time.Now().Unix()
	for jti, expiry := range tokenBlacklist.entries {
		if expiry < now {
			delete(tokenBlacklist.entries, jti)
		}
	}
}

func StartBlacklistCleanup() {
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			cleanupBlacklist()
		}
	}()
}
