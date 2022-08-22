
;; stake-coin-registry
;; <add a description here>

;; constants
;;

(define-constant stake-coin .wei-coin)
(define-constant reward-per-token-per-block u3)
;; data maps and vars
;;
(define-map stake-receipt-map principal { 
    amount : uint,
    update-at : uint ,
    })

(define-map reward-map principal uint)
;; private functions
;;
(define-private (calculate-reward-per-token (start-at uint) (end-at uint)) 
(begin
    (asserts! (>= end-at start-at) (err u105))
    (ok (* (- end-at start-at) reward-per-token-per-block))
))

(define-private (update-reward (holder principal)) 
(let (
    (opt-receipt (map-get? stake-receipt-map holder))
    ) 
    (match opt-receipt receipt  
    (let (
        (stake-amount (get amount receipt))
        (update-at (get update-at receipt))
        (now block-height)
        (reward-per-token (try! (calculate-reward-per-token update-at now)))
        (add-reward (* stake-amount reward-per-token))
        (reward (default-to u0 (map-get? reward-map holder)))
        (new-reward (+ reward add-reward))
        ) 
        (map-set stake-receipt-map holder {amount : stake-amount, update-at : now})
        (map-set reward-map holder new-reward)
        (ok true)
        ) 
    (ok true))
    )
    )

;; public functions
;;

(define-read-only (get-stake-amount (user principal))
    (let (
        (opt-receipt (map-get? stake-receipt-map user))
        ) 
    (match opt-receipt receipt (ok (get amount receipt)) (ok u0))
    )
)

(define-read-only (get-stake-receipt (user principal)) 
    (ok (map-get? stake-receipt-map user))
)

(define-read-only (get-stored-reward (user principal)) 
    (ok (default-to u0 (map-get? reward-map user)))
)

(define-public (stake (amount uint) ) 
(begin 
    (try! (update-reward tx-sender))
    (unwrap! (contract-call? .wei-coin burn amount tx-sender) (err u101))
    (map-set stake-receipt-map tx-sender {
        amount : amount , update-at : block-height
        })
    (ok true)
)
)

(define-public (unstake (amount uint)) 
(begin 
    (try! (update-reward tx-sender)) 
    (let (
        (receipt (unwrap! (map-get? stake-receipt-map tx-sender) (err u102)))
        (stake-amount (get amount receipt) )
    ) 
    (if (< stake-amount amount) 
        (err u103) 
        (begin 
            (unwrap! (contract-call? .wei-coin mint amount tx-sender) (err u104)) 
            (if (is-eq stake-amount amount) 
             (map-delete stake-receipt-map tx-sender)
             (map-set stake-receipt-map tx-sender {amount : (- stake-amount amount), update-at : block-height} )
             )
            (ok true)
        )
    ))
    ))

(define-public (claim-reward (amount uint)) 
(let (
    (owner tx-sender)
    (stored-amount (default-to u0 (map-get? reward-map owner)))
    ) 
    (asserts! (>= stored-amount amount) (err u108))
    (map-set reward-map owner (- stored-amount amount))
    (unwrap! (contract-call? .wei-coin mint amount owner) (err u104))
    (ok true)
    )
)

;; Initialize the contract
(begin 
(contract-call? .wei-coin mint u100000000 tx-sender)
)