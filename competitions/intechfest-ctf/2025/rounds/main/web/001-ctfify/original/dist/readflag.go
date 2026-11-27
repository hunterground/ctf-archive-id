package main

import (
	"fmt"
	"os"
)

func main() {
	flagPath := "/root/flag.txt"
	content, err := os.ReadFile(flagPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading flag file %s: %v\n", flagPath, err)
		os.Exit(1)
	}
	fmt.Print(string(content))
}
