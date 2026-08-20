package util

import (
	"crypto/rand"
	"math/big"
	"singer/go-template-new-2026-06/logger"
)

func SomeUtilMethods(data string) string {
	log := logger.GetLogger()
	log.Info("-= Some Utils Code =-")
	return "RESULT"
}

func RandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)

	for i := range result {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		result[i] = charset[num.Int64()]
	}

	return string(result)
}
