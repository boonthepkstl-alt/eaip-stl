package middleware

import (
	"singer/go-template-new-2026-06/util"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

func JWTAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var tokenStr string

		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"status":  "error",
					"message": "Invalid authorization format",
				})
			}
			tokenStr = parts[1]
		} else {
			tokenStr = c.Cookies("stl_token")
		}

		if tokenStr == "" && viper.GetBool("BYPASS_JWT") {
			userID := viper.GetString("BYPASS_JWT_USER_ID")
			username := viper.GetString("BYPASS_JWT_USERNAME")
			role := viper.GetString("BYPASS_JWT_ROLE")
			if userID == "" {
				userID = "bypass-user"
			}
			if username == "" {
				username = "bypass-user"
			}
			if role == "" {
				role = "admin"
			}
			c.Locals("userID", userID)
			c.Locals("username", username)
			c.Locals("role", role)
			return c.Next()
		}

		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  "error",
				"message": "Missing authorization",
			})
		}

		claims, err := util.ValidateToken(tokenStr)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid or expired token",
			})
		}

		if util.IsTokenBlacklisted(claims.ID) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  "error",
				"message": "Token has been revoked",
			})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)
		c.Locals("claims", claims)

		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status":  "error",
				"message": "Access denied",
			})
		}
		if role == "admin" {
			return c.Next()
		}
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status":  "error",
			"message": "Insufficient permissions",
		})
	}
}
