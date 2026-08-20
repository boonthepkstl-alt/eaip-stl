package util

import (
	"context"
	"strings"
	"time"

	"github.com/spf13/viper"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

func InitTracing(ctx context.Context) (func(context.Context) error, error) {
	if !viper.GetBool("OTEL_ENABLED") {
		return func(context.Context) error { return nil }, nil
	}

	endpoint := strings.TrimSpace(viper.GetString("OTEL_EXPORTER_OTLP_ENDPOINT"))
	if endpoint == "" {
		endpoint = strings.TrimSpace(viper.GetString("JAEGER_ENDPOINT"))
	}
	if endpoint == "" {
		return func(context.Context) error { return nil }, nil
	}

	options := []otlptracehttp.Option{
		otlptracehttp.WithTimeout(10 * time.Second),
	}

	if strings.HasPrefix(endpoint, "http://") || strings.HasPrefix(endpoint, "https://") {
		options = append(options, otlptracehttp.WithEndpointURL(endpoint))
	} else {
		options = append(options, otlptracehttp.WithEndpoint(endpoint))
	}

	if viper.GetBool("OTEL_EXPORTER_OTLP_INSECURE") || strings.HasPrefix(endpoint, "http://") {
		options = append(options, otlptracehttp.WithInsecure())
	}

	exporter, err := otlptracehttp.New(ctx, options...)
	if err != nil {
		return nil, err
	}

	serviceName := strings.TrimSpace(viper.GetString("OTEL_SERVICE_NAME"))
	if serviceName == "" {
		serviceName = strings.TrimSpace(viper.GetString("APP_NAME"))
	}
	if serviceName == "" {
		serviceName = "go-template-new-2026"
	}

	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironment(viper.GetString("ENV")),
			semconv.ServiceInstanceID(viper.GetString("INSTANCE")),
		),
	)
	if err != nil {
		return nil, err
	}

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tracerProvider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tracerProvider.Shutdown, nil
}
