from typing import Annotated
from fastapi import APIRouter, Form, Request, Depends, status, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash

from auth.tokenService import TokenService
from db.Database import Database
from auth.RequestModels import RegistrationRequestModel, LoginRequestModel, TokensModel, UserResponseModel, RefreshRequest


async def get_password_hash(request: Request):
    return request.app.state.password_hash

async def get_database(request: Request) -> Database:
    return request.app.state.db


auth_router = APIRouter(prefix="/auth")
auth_scheme = HTTPBearer()


@auth_router.post("/register/",
          description="Registration for new users.",
          status_code=status.HTTP_201_CREATED)
async def register(user_data: Annotated[RegistrationRequestModel, Form()],
                   password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
                   db: Annotated[Database, Depends(get_database)]):
    
    current_user_by_email = await db.get_user(user_data.email)
    if current_user_by_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {user_data.email} already exists."
        )
    
    password = user_data.password
    hashed_password = password_hash.hash(password)
    await db.create_user(user_data.email, hashed_password,
                         user_data.name, user_data.surname)
    

@auth_router.post("/login/",
          description="Login with password and username",
          response_model=TokensModel,
          status_code=status.HTTP_200_OK)
async def login(user_data: Annotated[LoginRequestModel, Form()],
                password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
                db: Annotated[Database, Depends(get_database)]):
    success_login = True
    current_user = await db.get_user(user_data.email)

    if current_user is None:
        fake_hash= "fake hash"
        password_hash.verify(user_data.password, fake_hash)
        success_login = False
    if not password_hash.verify(user_data.password, current_user.password):
        success_login = False

    if not success_login:
        raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    token_pair = TokenService.get_token_pair(current_user.email)
    token_pair.update({"token_type": "bearer"})
    return token_pair


@auth_router.get("/me/",
         description="Get the current user.",
         response_model=UserResponseModel,
         status_code=status.HTTP_200_OK)
async def get_user(authorization_data: Annotated[HTTPAuthorizationCredentials, Depends(auth_scheme)], db: Annotated[Database, Depends(get_database)]):
    token = authorization_data.credentials
    email = TokenService.decode_token(token, "access")
    user = await db.get_user(email)
    return UserResponseModel(**user)


@auth_router.post("/refresh/",
             description="Refresh token.",
             response_model=TokensModel,
             status_code=status.HTTP_200_OK)
async def refresh_token(data: RefreshRequest):
    token_pair = TokenService.refresh(data.refresh_token)
    token_pair.update({"token_type": "bearer"})
    return token_pair
