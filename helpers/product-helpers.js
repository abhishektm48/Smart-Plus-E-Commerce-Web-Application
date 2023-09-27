const { log } = require('debug/src/browser');
var db=require('../config/connection')
let collection=require('../config/collection')
let objectId=require('mongodb').ObjectID
const bcrypt=require('bcrypt');
const Collection = require('mongodb/lib/collection');

module.exports={
    addProduct:(product,callback)=>
    {
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>
        {
            //console.log(data);
            callback(data.ops[0]._id)
        })
    },

    getAllProduct:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let products=await db.get().collection(collection.PRODUCT_DETAILS).find().toArray()
            resolve(products)
        })
        
    },

    deleteProduct:(proId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_DETAILS).deleteOne({_id:objectId(proId)}).then((response)=>
            {
                resolve(response)
            })
        })
    },

    getProductDetails:(products)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_DETAILS).findOne({_id:objectId(products)}).then((response)=>
            {
                resolve(response)
            })
        })
    },

    updateProduct:(proId,products)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_DETAILS).updateOne({_id:objectId(proId)},{
                $set:{
                    pname:products.pname,
                    category:products.category,
                    price:products.price,
                    des:products.des
                }
            }).then((response)=>
            {
                resolve()
            })
        
        })
    },

    adminSignup:(adminData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            adminData.password=await bcrypt.hash(adminData.password,10)
            db.get().collection(collection.ADMIN_DETAILS).insertOne(adminData).then((response)=>
            {
                resolve(response.ops[0])
            })
        })
    },

    adminLogin:(adminData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let response={}
            let admin=await db.get().collection(collection.ADMIN_DETAILS).findOne({email:adminData.email})
            if(admin)
            {
                bcrypt.compare(adminData.password,admin.password).then((status)=>
                {
                    if(status)
                    {
                        console.log('Admin login success..!!');
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }
                    else
                    {
                        console.log('Admin login failed..!!');
                        resolve({status:false})
                    }
                })
            }
            else
            {
                console.log("Admin doesn't exist..!!");
                resolve({status:false})
            }
        })
    },

    getAllUsers: () =>
    {
        return new Promise(async(resolve,reject) =>
        {
            await db.get().collection(collection.USER_DETAILS).find().toArray().then((response) =>
            {
                resolve(response);
            })
            
        })
        
    }
}