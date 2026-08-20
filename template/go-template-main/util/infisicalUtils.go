package util

import (
	"bufio"
	"context"
	"fmt"
	"strings"

	"github.com/ggwhite/go-masker"
	infisical "github.com/infisical/go-sdk"
	"github.com/spf13/viper"
)

type EnvVar struct {
	Key   string
	Value string
}

func GetInfisicalSecret(url string, clientid string, clientsecret string, secretkey string, env string, projectid string) {
	ctx := context.Background()

	// "https://infisical.singerthai.cloud"
	client := infisical.NewInfisicalClient(ctx, infisical.Config{
		SiteUrl: url, // Optional, default is https://app.infisical.com
	})

	_, err := client.Auth().UniversalAuthLogin(clientid, clientsecret)

	if err != nil {
		fmt.Printf("Authentication failed: %v", err)
	}

	apiKeySecret, err := client.Secrets().Retrieve(infisical.RetrieveSecretOptions{
		SecretKey:   secretkey,
		Environment: env,
		ProjectID:   projectid,
		SecretPath:  "/",
	})

	if err != nil {
		fmt.Printf("Error: %v", err)
	}

	fmt.Printf("API Key Secret: %v", apiKeySecret)
	ParseEnvText(apiKeySecret.SecretValue)
}

func ParseEnvText(text string) {

	scanner := bufio.NewScanner(strings.NewReader(text))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines
		if line == "" {
			continue
		}

		// Split on first = only
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		fmt.Println("key:", key, "value:", masker.String(masker.MCreditCard, value))
		viper.Set(key, value)
	}

}
