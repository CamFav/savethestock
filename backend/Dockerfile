FROM mcr.microsoft.com/dotnet/sdk:10.0.101 AS restore
WORKDIR /src

COPY SaveTheStock.sln ./
COPY SaveTheStock.Api/SaveTheStock.Api.csproj SaveTheStock.Api/
COPY SaveTheStock.Application/SaveTheStock.Application.csproj SaveTheStock.Application/
COPY SaveTheStock.Domain/SaveTheStock.Domain.csproj SaveTheStock.Domain/
COPY SaveTheStock.Infrastructure/SaveTheStock.Infrastructure.csproj SaveTheStock.Infrastructure/
COPY SaveTheStock.Api.Tests/SaveTheStock.Api.Tests.csproj SaveTheStock.Api.Tests/

RUN dotnet restore SaveTheStock.sln

FROM restore AS dev
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
WORKDIR /backend
EXPOSE 8080
CMD ["dotnet", "run", "--no-launch-profile", "--project", "/backend/SaveTheStock.Api/SaveTheStock.Api.csproj", "--urls", "http://0.0.0.0:8080", "-p:UseAppHost=false"]

FROM restore AS build
COPY . .
RUN dotnet publish SaveTheStock.Api/SaveTheStock.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0.1 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish ./
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
ENTRYPOINT ["dotnet", "SaveTheStock.Api.dll"]
