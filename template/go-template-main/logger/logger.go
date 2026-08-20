// logger/logger.go
package logger

import (
	"context"
	"runtime"
	"strings"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
	"go.opentelemetry.io/otel/trace"
)

// GetLogger returns a configured logrus logger with component and function info
func GetLogger() *log.Entry {
	return log.WithFields(buildFields(2, nil))
}

// GetLoggerWithContext returns a configured logrus logger enriched with trace information.
func GetLoggerWithContext(ctx context.Context) *log.Entry {
	return log.WithFields(buildFields(2, ctx))
}

// GetLoggerWithFiber returns a configured logrus logger enriched with the active Fiber request trace.
func GetLoggerWithFiber(c *fiber.Ctx) *log.Entry {
	if c == nil {
		return GetLogger()
	}
	return log.WithFields(buildFields(2, c.UserContext()))
}

func buildFields(depth int, ctx context.Context) log.Fields {
	pc, file, _, ok := runtime.Caller(depth)
	if !ok {
		return traceFields(ctx)
	}

	functionParts := strings.Split(runtime.FuncForPC(pc).Name(), ".")
	fileParts := strings.Split(file, "/")

	fields := log.Fields{
		"component": fileParts[len(fileParts)-1],
		"function":  functionParts[len(functionParts)-1],
	}

	for k, v := range traceFields(ctx) {
		fields[k] = v
	}

	return fields
}

func traceFields(ctx context.Context) log.Fields {
	fields := log.Fields{}
	if ctx == nil {
		return fields
	}

	spanCtx := trace.SpanContextFromContext(ctx)
	if !spanCtx.IsValid() {
		return fields
	}

	fields["trace_id"] = spanCtx.TraceID().String()
	fields["span_id"] = spanCtx.SpanID().String()
	return fields
}
