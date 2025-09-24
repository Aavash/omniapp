# Use an official Python runtime as a parent image
FROM python:3.13-alpine

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Install uv 
RUN pip install --no-cache-dir uv 

# Set the working directory in the container
WORKDIR /app

# Copy pyproject.toml the working directory
COPY pyproject.toml uv.lock* /app/
# Install the dependencies
RUN uv pip install --system -r pyproject.toml

# Copy the current directory contents into the container at /app
COPY . /app/

# Expose port 8000 to the outside world
EXPOSE 8000

# Run the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
