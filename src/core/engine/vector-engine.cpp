// src/core/engine/vector-engine.cpp
#include "vector-engine.h"
#include <sstream>
#include <iomanip>

// Implementation of Shape member functions
void Shape::setFill(const std::string& newFill) {
    fill = newFill;
}

void Shape::setStroke(const std::string& newStroke) {
    stroke = newStroke;
}

void Shape::setStrokeWidth(double width) {
    strokeWidth = width;
}

void Shape::setSelected(bool select) {
    isSelected = select;
}

// Helper function to format floating-point numbers consistently
std::string formatFloat(double value) {
    std::stringstream ss;
    ss << std::fixed << std::setprecision(2) << value;
    return ss.str();
}

// Rectangle implementation
std::string Rectangle::getSVGString() const {
    std::stringstream svg;
    
    // Build the transformation string
    std::string transformStr = "";
    if (transform.translateX != 0 || transform.translateY != 0) {
        transformStr += "translate(" + formatFloat(transform.translateX) + "," 
                     + formatFloat(transform.translateY) + ") ";
    }
    if (transform.rotation != 0) {
        transformStr += "rotate(" + formatFloat(transform.rotation) + ") ";
    }
    if (transform.scaleX != 1 || transform.scaleY != 1) {
        transformStr += "scale(" + formatFloat(transform.scaleX) + "," 
                     + formatFloat(transform.scaleY) + ")";
    }

    // Generate the SVG rectangle element
    svg << "<rect"
        << " id=\"" << id << "\""
        << " x=\"" << formatFloat(origin.x) << "\""
        << " y=\"" << formatFloat(origin.y) << "\""
        << " width=\"" << formatFloat(width) << "\""
        << " height=\"" << formatFloat(height) << "\"";
    
    if (!transformStr.empty()) {
        svg << " transform=\"" << transformStr << "\"";
    }
    
    svg << " fill=\"" << fill << "\""
        << " stroke=\"" << stroke << "\""
        << " stroke-width=\"" << formatFloat(strokeWidth) << "\"";
        
    if (isSelected) {
        svg << " class=\"selected\"";
    }
    
    svg << "/>";
    
    return svg.str();
}

// Circle implementation
std::string Circle::getSVGString() const {
    std::stringstream svg;
    
    // Build the transformation string
    std::string transformStr = "";
    if (transform.translateX != 0 || transform.translateY != 0) {
        transformStr += "translate(" + formatFloat(transform.translateX) + "," 
                     + formatFloat(transform.translateY) + ") ";
    }
    if (transform.rotation != 0) {
        transformStr += "rotate(" + formatFloat(transform.rotation) + ") ";
    }
    if (transform.scaleX != 1 || transform.scaleY != 1) {
        transformStr += "scale(" + formatFloat(transform.scaleX) + "," 
                     + formatFloat(transform.scaleY) + ")";
    }

    // Generate the SVG circle element
    svg << "<circle"
        << " id=\"" << id << "\""
        << " cx=\"" << formatFloat(center.x) << "\""
        << " cy=\"" << formatFloat(center.y) << "\""
        << " r=\"" << formatFloat(radius) << "\"";
    
    if (!transformStr.empty()) {
        svg << " transform=\"" << transformStr << "\"";
    }
    
    svg << " fill=\"" << fill << "\""
        << " stroke=\"" << stroke << "\""
        << " stroke-width=\"" << formatFloat(strokeWidth) << "\"";
        
    if (isSelected) {
        svg << " class=\"selected\"";
    }
    
    svg << "/>";
    
    return svg.str();
}

// VectorEngine implementation
VectorEngine::VectorEngine() : nextShapeId(0) {
    // Initialize any engine-specific resources here
}

VectorEngine::~VectorEngine() {
    // Cleanup engine resources if needed
    shapes.clear();
}

std::string VectorEngine::createRectangle(double x, double y, double width, double height) {
    std::string id = generateShapeId();
    auto rectangle = std::make_unique<Rectangle>(id, x, y, width, height);
    shapes.push_back(std::move(rectangle));
    return id;
}

std::string VectorEngine::createCircle(double cx, double cy, double radius) {
    std::string id = generateShapeId();
    auto circle = std::make_unique<Circle>(id, cx, cy, radius);
    shapes.push_back(std::move(circle));
    return id;
}

void VectorEngine::transformShape(const std::string& id, double tx, double ty, 
                                double rotation, double sx, double sy) {
    auto it = std::find_if(shapes.begin(), shapes.end(),
        [&id](const std::unique_ptr<Shape>& shape) {
            return shape->getId() == id;
        });
    
    if (it != shapes.end()) {
        Transform t;
        t.translateX = tx;
        t.translateY = ty;
        t.rotation = rotation;
        t.scaleX = sx;
        t.scaleY = sy;
        (*it)->setTransform(t);
    }
}

std::string VectorEngine::getAllShapesSVG() {
    std::stringstream svg;
    for (const auto& shape : shapes) {
        svg << shape->getSVGString() << "\n";
    }
    return svg.str();
}

// The EMSCRIPTEN_BINDINGS block is already in the header file