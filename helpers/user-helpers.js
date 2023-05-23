//const { log } = require('debug/src/browser');
var db=require('../config/connection')
let collection=require('../config/collection')
const bcrypt=require('bcrypt')
let objectId=require('mongodb').ObjectID
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_RR3269kwLCsWwA',
    key_secret: '7QdpcNgDXYmanTCvJFajx6Io',
  });

module.exports={
    getUsers:(userData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_DETAILS).insertOne(userData).then((response)=>
            {
                resolve(response.ops[0])
            })
            
        })
        
    },

    doLogin:(userData)=>
    {
        return new Promise(async (resolve,reject)=>
        {
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_DETAILS).findOne({email:userData.email})
            if(user)
            {
            bcrypt.compare(userData.password,user.password).then((status)=>
                {
                    if(status)
                    {
                        console.log('Login Success..!!');
                        response.user=user
                        response.status=true 
                        resolve(response)
                    }
                    else
                    {
                        console.log('Login False..!!');
                        resolve({status:false})
                    }
                })
            }
            else
            {
            console.log('User Not Found..!!');
            resolve({status:false})
            }
        })
    },

    addToCart:(proId,userId)=>
    {
        let proObj={
            item:objectId(proId),
            quantity:1
        }

        return new Promise(async(resolve,reject)=>
        {
            let usercart=await db.get().collection(collection.CART_DETAILS).findOne({user:objectId(userId)})

            if(usercart)
            {
                let proExist=usercart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1)
                {
                    db.get().collection(collection.CART_DETAILS)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>
                    {
                        resolve()
                    })
                }
                else
                {
                db.get().collection(collection.CART_DETAILS).updateOne({user:objectId(userId)},
                {
                    $push:{
                        
                        products:proObj
                    }
                }).then((response)=>
                {
                    resolve()
                })
            }
            }
            else
            {
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }

                db.get().collection(collection.CART_DETAILS).insertOne(cartObj).then((response)=>
                {
                    resolve()
                })
            }
        })
    },

     getCartProducts:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let cartItems=await db.get().collection(collection.CART_DETAILS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_DETAILS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },

                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    getCartCount:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let count=0
            let cart=await db.get().collection(collection.CART_DETAILS).findOne({user:objectId(userId)})
            if(cart)
            {
                count=cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity:(details)=>
    {
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>
        {
            if(details.count==-1 && details.quantity==1)
            {
                db.get().collection(collection.CART_DETAILS).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>
                {
                    resolve({removeProduct:true})
                })
            }
            else
            {
                db.get().collection(collection.CART_DETAILS)
            .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>
            {
                resolve({status:true})
            })
            }
        })
    },

    removeCart:(details)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.CART_DETAILS).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }).then((response)=>
            {
                resolve({removeProduct:true})
            }) 
        })
    },

    getTotalAmount:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let total=await db.get().collection(collection.CART_DETAILS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_DETAILS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },

                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },

                {
                    $group:{
                        _id:null,
                        total: {$sum: {$multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.price" }]}}
                    }
                }
            ]).toArray()
            console.log(total[0].total);
            resolve(total[0].total)
        })
    },

    placeOrder:(order,products,total)=>
    {
        return new Promise((resolve,reject)=>
        {
            console.log(order,products,total);
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode         
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }

            db.get().collection(collection.ORDER_DETAILS).insertOne(orderObj).then((response)=>
            {
                db.get().collection(collection.CART_DETAILS).removeOne({user:objectId(order.userId)})
                resolve(response.ops[0]._id)
            })
        })
    },

    getCartProductList:(userId)=>
    {
        console.log(userId);
        return new Promise(async(resolve,reject)=>
        {
            let cart=await db.get().collection(collection.CART_DETAILS).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    },

    getUserOrders:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let orders=await db.get().collection(collection.ORDER_DETAILS).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let orderItems=await db.get().collection(collection.ORDER_DETAILS).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_DETAILS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },

                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    generateRazorpay:(orderId,total)=>
    {
        return new Promise((resolve,reject)=>
        {
          var options={
            amount: total*100, // amount in the smallest currency unit.
            currency: "INR",
            receipt: ''+orderId,
            notes: {
            key1: "value3",
            key2: "value2"
             }
          }
          
          instance.orders.create(options,(err,order)=>
          {
            if(err)
            {
                console.log('Error:',err);
            }
            else
            {
                console.log('New order:',order);
                resolve(order)
            }
          })
        })
    },

    verifyPayment:(details)=>
    {
        return new Promise((resolve,reject)=>
        {
            const crypto=require('crypto');
            let hmac=crypto.createHmac('sha256','7QdpcNgDXYmanTCvJFajx6Io')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]'])
            {
                resolve()
            }
            else
            {
                reject()
            }
        })
    },

    changePaymentStatus:(orderId)=>
    {
      return new Promise((resolve,reject)=>
      {
        db.get().collection(collection.ORDER_DETAILS)
        .updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }
        ).then(()=>
        {
            resolve()
        })
      })  
    }
}