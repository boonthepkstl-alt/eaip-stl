package middleware

import (
	"fmt"
	"runtime/debug"
	"singer/go-template-new-2026-06/logger"

	"github.com/gofiber/fiber/v2"
)

// Recovery middleware catches panics and prevents service crashes
func Recovery() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				log := logger.GetLoggerWithFiber(c)

				// Create a formatted multi-line string for the panic log
				errorMsg := fmt.Sprintf("PANIC RECOVERED: %v\n\nRequest: %s %s\nIP: %s\nUser-Agent: %s\n\nStack trace:\n%s",
					r,
					c.Method(),
					c.Path(),
					c.IP(),
					c.Get("User-Agent"),
					debug.Stack(),
				)

				// Log the formatted panic message
				log.Error(errorMsg)

				// Return clean error response
				err := c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"status":  "error",
					"message": "Internal server error",
				})

				if err != nil {
					log.Errorf("Failed to send panic error response: %v", err)
				}
			}
		}()

		return c.Next()
	}
}
