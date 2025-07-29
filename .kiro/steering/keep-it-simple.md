---
inclusion: always
---

# Keep It Simple

## Core Principle

Choose the simplest solution that solves the problem completely. Elegant simplicity beats complex abstractions.

## When to Keep It Simple

### Architecture Decisions

- Start with straightforward implementations before adding layers
- Avoid premature abstractions until patterns emerge
- Choose boring, proven technologies over cutting-edge alternatives
- Prefer composition over inheritance hierarchies

### Code Implementation

- Write clear, readable code over clever optimizations
- Use standard library functions instead of custom utilities
- Avoid unnecessary design patterns when direct approaches work
- Keep function signatures simple with minimal parameters

### Problem Solving

- Solve the actual problem, not the imagined future problem
- Build incrementally rather than designing comprehensive systems upfront
- Use existing solutions before building custom ones
- Question whether complexity adds real value

## Simple vs Simplistic

### Good Simplicity

- Clear naming that explains intent
- Straightforward control flow
- Minimal dependencies
- Direct problem-to-solution mapping
- Easy to test and debug

### Avoid Simplistic Solutions

- Hardcoded values that should be configurable
- Copy-paste code instead of proper abstractions
- Ignoring error handling or edge cases
- Skipping necessary validation or security measures
- Technical debt that creates future maintenance burden

## Red Flags for Over-Engineering

- Multiple layers of abstraction for simple operations
- Configuration systems for values that never change
- Generic solutions for specific, well-defined problems
- Complex inheritance hierarchies with minimal shared behavior
- Frameworks or libraries added for single-use functionality

## Implementation Guidelines

- Start with the most direct implementation
- Refactor to patterns only when complexity justifies it
- Measure actual performance before optimizing
- Document why simple approaches were chosen
- Resist the urge to showcase technical sophistication

Remember: The best code is code that works reliably and can be easily understood and modified by others.
