package model

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	Token     string   `json:"token"`
	ExpiresAt int64    `json:"expires_at"`
	User      UserInfo `json:"user"`
}

type UserInfo struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}
