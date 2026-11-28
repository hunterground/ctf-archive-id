cmake_minimum_required(VERSION 3.16)

project(FlactCheck LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(FLTK REQUIRED)
include_directories(${FLTK_INCLUDE_DIR})

add_executable(flact-check src/main.cpp)
target_link_libraries(flact-check PRIVATE ${FLTK_LIBRARIES})
