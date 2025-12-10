from passlib.context import CryptContext

pwdContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verifyPassword(plainPassword: str, hashedPassword: str) -> bool:
    return pwdContext.verify(plainPassword, hashedPassword)

def getPasswordHash(password: str) -> str:
    return pwdContext.hash(password)