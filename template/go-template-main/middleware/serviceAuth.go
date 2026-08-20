package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

func ServiceAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		expected := strings.TrimSpace(viper.GetString("INTERNAL_API_KEY"))
		provided := strings.TrimSpace(c.Get("apikey"))
		if expected == "" || provided == "" || provided != expected {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid service API key",
			})
		}
		serviceName := strings.TrimSpace(c.Get("user"))
		if serviceName == "" {
			serviceName = "internal-service"
		}
		c.Locals("serviceName", serviceName)
		return c.Next()
	}
}
