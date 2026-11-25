#!/bin/bash
# roblox-docker-manager.sh
# Roblox University SIAKAD Challenge - Docker Management Script
# Author: NoobMaster69 (definitely not a script kiddie)

# Colors for output (make it look professional, not like noob code)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Roblox-themed helper functions
print_info() {
    echo -e "${BLUE}🎮 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}💀 $1 (oof!)${NC}"
}

print_robux() {
    echo -e "${YELLOW}💰 $1${NC}"
}

# Build and run the Docker container (no exploits, promise!)
build_and_run() {
    print_info "Building Roblox University SIAKAD Challenge Docker image..."
    print_robux "Cost: 0 Robux (it's free!)"
    
    # Build the image
    docker build -t roblox-university-siakad:latest . || {
        print_error "Failed to build Docker image (skill issue detected)"
        exit 1
    }
    
    print_success "Docker image built successfully! (no lag detected)"
    
    # Stop existing container if running
    if [ "$(docker ps -q -f name=roblox-siakad-challenge)" ]; then
        print_warning "Stopping existing container (preventing server crash)..."
        docker stop roblox-siakad-challenge
        docker rm roblox-siakad-challenge
    fi
    
    print_info "Starting Roblox University SIAKAD Challenge..."
    
    # Run the container
    docker run -d \
        --name roblox-siakad-challenge \
        -p 3000:3000 \
        --restart unless-stopped \
        roblox-university-siakad:latest || {
        print_error "Failed to start container (server went oof)"
        exit 1
    }
    
    print_success "Container started successfully! (server online, no lag)"
    print_info "🚀 Challenge available at: http://localhost:3000"
    print_robux "🏆 Target: Find the JWT secret and become admin (pro level)"
    print_warning "💡 Remember: This is totally secure code (definitely no vulnerabilities)"
}

# Use Docker Compose (for the lazy developers)
compose_up() {
    print_info "Starting Roblox University with Docker Compose..."
    print_info "🎮 Powering up the Roblox servers (hopefully they don't crash)"
    
    docker-compose up -d --build || {
        print_error "Failed to start with Docker Compose (blame the noob developer)"
        exit 1
    }
    
    print_success "Services started with Docker Compose! (all systems operational)"
    print_info "🚀 Challenge available at: http://localhost:3000"
    print_robux "💰 Robux balance: ∞ (hacker mode activated)"
}

# Stop services (shutdown the Roblox servers)
compose_down() {
    print_info "Stopping Roblox University services..."
    print_warning "⚡ Shutting down servers (saving your progress... hopefully)"
    docker-compose down
    print_success "Services stopped! (no data lost, we think)"
}

# Show logs (debug the noob code)
show_logs() {
    print_info "Showing container logs (debugging noob mistakes)..."
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose logs -f
    else
        docker logs -f roblox-siakad-challenge
    fi
}

# Clean up (delete all evidence)
cleanup() {
    print_warning "Cleaning up Docker resources (destroying evidence)..."
    
    # Stop and remove container
    docker stop roblox-siakad-challenge 2>/dev/null || true
    docker rm roblox-siakad-challenge 2>/dev/null || true
    
    # Remove image
    docker rmi roblox-university-siakad:latest 2>/dev/null || true
    
    # Docker compose cleanup
    docker-compose down 2>/dev/null || true
    
    print_success "Cleanup completed! (all traces removed)"
}

# Development mode with hot reload (for the smart developers)
dev_mode() {
    print_info "Starting development mode with hot reload (pro developer mode)..."
    print_warning "🔧 This mode is for developers only (noobs not allowed)"
    
    docker run -it --rm \
        --name roblox-dev \
        -p 3000:3000 \
        -v "$(pwd):/app" \
        -v /app/node_modules \
        --env NODE_ENV=development \
        node:18-alpine \
        sh -c "cd /app && npm install && npm run dev"
}

# Check container status (system diagnostics)
status() {
    print_info "Roblox University System Status:"
    echo ""
    print_robux "🏭 Container Status:"
    docker ps -f name=roblox --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    print_info "📦 Image Information:"
    docker images roblox-university-siakad --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo ""
    print_info "🌐 Health Check:"
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "API is healthy (server not lagging)"
    else
        print_error "API is down (server went oof)"
    fi
}

# Show help (for confused noobs)
show_help() {
    echo -e "${BLUE}🎮 Roblox University SIAKAD - Docker Management${NC}"
    echo -e "${PURPLE}🏆 WRECK IT 6.0 Challenge - by r4jxd0l${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  build       Build and run the Docker container (recommended for noobs)"
    echo "  up          Start with Docker Compose (easy mode)"
    echo "  down        Stop Docker Compose services (shutdown servers)"
    echo "  logs        Show container logs (debug mode)"
    echo "  dev         Start development mode with hot reload (pro mode)"
    echo "  status      Show container status (system diagnostics)"
    echo "  cleanup     Remove all containers and images (nuke everything)"
    echo "  help        Show this help message (for confused users)"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 build     # Build and start the challenge (noob-friendly)"
    echo "  $0 up        # Start with docker-compose (lazy mode)"
    echo "  $0 logs      # View logs (debug the crashes)"
    echo "  $0 cleanup   # Clean up everything (reset to factory settings)"
    echo ""
    echo -e "${GREEN}🎯 Challenge Objective:${NC}"
    echo "  - Find the JWT secret key in client-side code"
    echo "  - Escalate privileges from 'mahasiswa' to 'admin'"
    echo "  - Access the restricted grades API endpoint"
    echo "  - Capture the flag: WRECKIT60{...}"
    echo ""
    echo -e "${RED}⚠️  Disclaimer:${NC}"
    echo "  This challenge contains intentional security vulnerabilities."
    echo "  For educational purposes only. Don't try this on real systems!"
    echo ""
    echo -e "${ROBUX}💰 Good luck, and may the Robux be with you! 🎮${NC}"
}

# Easter eggs (because why not?)
konami_code() {
    echo -e "${PURPLE}🎮 KONAMI CODE ACTIVATED! 🎮${NC}"
    echo -e "${YELLOW}💰 +30 Lives, +∞ Robux, God Mode: ON${NC}"
    echo -e "${GREEN}🏆 You found the secret developer mode!${NC}"
    echo ""
    echo "Available cheat codes:"
    echo "  - JWT_SECRET: r0bl0x_n00b_h4x0r_g3t_r3kt_m8_42069"
    echo "  - ADMIN_PASSWORD: admin123"
    echo "  - FLAG_PREVIEW: WRECKIT60{r0bl0x_n00b_g0t_pwn3d_1n_cl13nt_s1d3}"
    echo ""
    echo -e "${RED}🚨 Wait, you weren't supposed to see this! 🚨${NC}"
    echo -e "${BLUE}Quick! Pretend this never happened! 🤫${NC}"
}

# Main script logic (the brain of the operation)
case "${1:-help}" in
    "build")
        build_and_run
        ;;
    "up")
        compose_up
        ;;
    "down")
        compose_down
        ;;
    "logs")
        show_logs
        ;;
    "dev")
        dev_mode
        ;;
    "status")
        status
        ;;
    "cleanup")
        cleanup
        ;;
    "konami"|"cheat"|"secret")
        konami_code
        ;;
    "help"|*)
        show_help
        ;;
esac