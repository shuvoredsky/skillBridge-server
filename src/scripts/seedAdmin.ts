import { prisma } from "../lib/prisma"
import { UserRole } from "../middleware/auth"

async function seedAdmin(){
    try{
        console.log('*******Admin started*********')
        const adminData = {
            name: "Admin shuvo",
            email: "admin@admin.com",
            role: UserRole.ADMIN,
            password: "admin1234"
        }

        console.log('*******Checking admin exist or not*********')
        const existingUser = await prisma.user.findUnique({
            where: {
                email: adminData.email
            }
        })

        if(existingUser){
            throw new Error("User alrady exists in db")
        }

        const signUpAdmin = await fetch("http://localhost:5000/api/auth/sign-up/email", {
            method: "POST",
            headers:{
                "Content-Type": 'application/json'
            },
            body:JSON.stringify(adminData)
        })

        
        // console.log(signUpAdmin)

        if(signUpAdmin.ok){
            console.log("****ADMIN Creted*****")
            await prisma.user.update({
                where:{
                    email: adminData.email
                },
                data:{
                    emailVerified: true   
                }
            })
            console.log("****Email verification updated*****")
        }

        console.log("***Success***")

    }catch(error){
        console.error(error)
    }
}

seedAdmin()