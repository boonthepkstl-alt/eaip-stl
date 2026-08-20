package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"singer/go-template-new-2026-06/logger"
	"singer/go-template-new-2026-06/model"
	"strings"

	"github.com/spf13/viper"
)

type SampleHandler interface {
	SampleFunction(data string) (model.SampleModel, error)
}

type sampleHandler struct{}

func NewSampleHandler() sampleHandler {
	return sampleHandler{}
}

func (obj sampleHandler) SampleFunction(data string) (model.SampleModel, error) {
	log := logger.GetLogger()
	log.Info("-= SampleHandler:SampleFunction =-")

	url := viper.GetString("SAMPLE_ENDPOINT")
	method := "POST"

	payload := strings.NewReader(`{
    "samplevalue": "1234 ",
    "samplevalue2": "2026-04-03 00:00:01.000",
    "samplevalue3": "2026-04-03 23:59:59.000",
    "samplevalue4": "123455"
}`)

	client := &http.Client{}
	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		log.Errorf("Error creating request: %v", err)
		return model.SampleModel{}, err
	}
	req.Header.Add("apikey", "9KzNGvXB")
	req.Header.Add("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		log.Errorf("Error creating request: %v", err)
		return model.SampleModel{}, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		log.Errorf("Error creating request: %v", err)
		return model.SampleModel{}, err
	}
	log.Infof("Response: %v", string(body))
	var result model.SampleModel
	json.Unmarshal(body, &result)
	return result, nil
}
