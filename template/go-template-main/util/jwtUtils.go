package util

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

type JWTClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	FullName string `json:"full_name"`
	jwt.RegisteredClaims
}

func generateJTI() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(b)
}

func GenerateToken(userID, username, role, fullName string) (string, int64, error) {
	secret := viper.GetString("JWT_SECRET")
	expireHours := viper.GetInt("JWT_EXPIRE_HOURS")
	if expireHours == 0 {
		expireHours = 24
	}

	expiresAt := time.Now().Add(time.Duration(expireHours) * time.Hour)
	claims := JWTClaims{
		UserID:   userID,
		Username: username,
		Role:     role,
		FullName: fullName,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        generateJTI(),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	return signed, expiresAt.Unix(), err
}

func ValidateToken(tokenStr string) (*JWTClaims, error) {
	secret := viper.GetString("JWT_SECRET")

	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
