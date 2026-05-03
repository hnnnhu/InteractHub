FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN rm -f SocialGraphPlatform.slnx
RUN dotnet publish SocialGraphPlatform.API/SocialGraphPlatform.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 10000
CMD ["dotnet", "SocialGraphPlatform.API.dll"]
