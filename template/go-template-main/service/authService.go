package service

import (
	"errors"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"singer/go-template-new-2026-06/util"

	"github.com/spf13/viper"
)

type AuthService interface {
	Login(username, password string) (*model.TokenResponse, error)
}

type authService struct{}

func NewAuthService() AuthService {
	return &authService{}
}

func (s *authService) Login(username, password string) (*model.TokenResponse, error) {
	log := logger.GetLogger()

	if username == "" || password == "" {
		return nil, errors.New("username and password are required")
	}

	demoUsername := viper.GetString("AUTH_DEMO_USERNAME")
	demoPassword := viper.GetString("AUTH_DEMO_PASSWORD")
	demoRole := viper.GetString("AUTH_DEMO_ROLE")
	demoFullName := viper.GetString("AUTH_DEMO_FULL_NAME")
	if demoUsername == "" {
		demoUsername = "admin"
	}
	if demoPassword == "" {
		demoPassword = "password"
	}
	if demoRole == "" {
		demoRole = "admin"
	}
	if demoFullName == "" {
		demoFullName = "Template Admin"
	}

	if username != demoUsername || password != demoPassword {
		log.Warnf("Login failed for user: %s", username)
		return nil, errors.New("invalid credentials")
	}

	token, expiresAt, err := util.GenerateToken(username, username, demoRole, demoFullName)
	if err != nil {
		log.Errorf("Failed to generate token: %v", err)
		return nil, err
	}

	return &model.TokenResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: model.UserInfo{
			ID:       username,
			Username: username,
			FullName: demoFullName,
			Role:     demoRole,
		},
	}, nil
}
