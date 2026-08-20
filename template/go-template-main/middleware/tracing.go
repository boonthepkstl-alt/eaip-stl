package middleware

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

func Tracing() fiber.Handler {
	tracer := otel.Tracer("http-server")

	return func(c *fiber.Ctx) error {
		spanName := fmt.Sprintf("%s %s", c.Method(), c.Route().Path)
		if c.Route() == nil || c.Route().Path == "" {
			spanName = fmt.Sprintf("%s %s", c.Method(), c.Path())
		}

		ctx, span := tracer.Start(c.UserContext(), spanName, trace.WithSpanKind(trace.SpanKindServer))
		defer span.End()

		c.SetUserContext(ctx)

		spanCtx := span.SpanContext()
		if spanCtx.IsValid() {
			traceID := spanCtx.TraceID().String()
			spanID := spanCtx.SpanID().String()
			c.Locals("trace_id", traceID)
			c.Locals("span_id", spanID)
			c.Set("X-Trace-ID", traceID)
		}

		span.SetAttributes(
			attribute.String("http.method", c.Method()),
			attribute.String("http.route", c.Path()),
			attribute.String("http.scheme", c.Protocol()),
			attribute.String("url.path", c.Path()),
			attribute.String("user_agent.original", c.Get("User-Agent")),
			attribute.String("client.address", c.IP()),
		)

		err := c.Next()
		statusCode := c.Response().StatusCode()
		span.SetAttributes(attribute.Int("http.status_code", statusCode))
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return err
		}
		if statusCode >= fiber.StatusInternalServerError {
			span.SetStatus(codes.Error, fiber.ErrInternalServerError.Message)
		}

		return nil
	}
}
