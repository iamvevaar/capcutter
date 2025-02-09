// src/core/engine/vector-engine.h
#pragma once
#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <memory>
#include <cmath>

// Define our basic geometry structures
struct Point {
    double x;
    double y;
};

struct Transform {
    double translateX = 0;
    double translateY = 0;
    double rotation = 0;
    double scaleX = 1;
    double scaleY = 1;
};

// Base class for all shapes
// In vector-engine.h, update the Shape class
class Shape {
protected:
    std::string id;
    Transform transform;
    std::string fill;
    std::string stroke;
    double strokeWidth;
    bool isSelected;

public:
    Shape(const std::string& shapeId) : 
        id(shapeId), 
        fill("none"),
        stroke("#000000"),
        strokeWidth(1),
        isSelected(false) {}

    virtual ~Shape() = default;
    virtual std::string getSVGString() const = 0;
    
    // Add these declarations
    void setFill(const std::string& newFill);
    void setStroke(const std::string& newStroke);
    void setStrokeWidth(double width);
    void setSelected(bool select);
    
    void setTransform(const Transform& t) { transform = t; }
    const Transform& getTransform() const { return transform; }
    const std::string& getId() const { return id; }
};
// Rectangle implementation
class Rectangle : public Shape {
private:
    double width;
    double height;
    Point origin;

public:
    Rectangle(const std::string& id, double x, double y, double w, double h)
        : Shape(id), origin{x, y}, width(w), height(h) {}

    std::string getSVGString() const override;  // Remove implementation
};

// Circle implementation
class Circle : public Shape {
private:
    Point center;
    double radius;

public:
    Circle(const std::string& id, double cx, double cy, double r)
        : Shape(id), center{cx, cy}, radius(r) {}

    std::string getSVGString() const override;  // Remove implementation
};

// Main engine class that manages all shapes
class VectorEngine {
private:
    std::vector<std::unique_ptr<Shape>> shapes;
    int nextShapeId = 0;

    std::string generateShapeId() {
        return "shape_" + std::to_string(nextShapeId++);
    }

public:
    VectorEngine();  // Declare constructor
    ~VectorEngine(); // Declare destructor
    
    std::string createRectangle(double x, double y, double width, double height);
    std::string createCircle(double cx, double cy, double radius);
    void transformShape(const std::string& id, double tx, double ty, double rotation, double sx, double sy);
    std::string getAllShapesSVG();
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(vector_engine) {
    emscripten::class_<VectorEngine>("VectorEngine")
        .constructor<>()
        .function("createRectangle", &VectorEngine::createRectangle)
        .function("createCircle", &VectorEngine::createCircle)
        .function("transformShape", &VectorEngine::transformShape)
        .function("getAllShapesSVG", &VectorEngine::getAllShapesSVG);
}