(use-trait ft-trait .sip010-ft-trait.ft-trait)
;; coin-swap-registry
;; <add a description here>

;; constants
;;
(define-constant coin-x .dai-coin)
(define-constant coin-y .wan-coin)
(define-constant liquid-coin .wei-coin)
(define-constant err-get-dai-balances (err u101))
(define-constant err-get-wan-balances (err u102))
(define-constant err-set-reserve-x (err u103))
(define-constant err-set-reserve-y (err u104))
(define-constant err-get-total-liquidity (err u105))
(define-constant err-ft-transfer (err u106))
(define-constant err-wei-coin-mint (err u107))
(define-constant err-wei-coin-burn (err u108))
(define-constant err-shares-less-than-zero (err u109))
(define-constant err-total-shares-not-enough (err u110))
(define-constant err-invalid-withdraw-amount (err u111))

;; data maps and vars
;;
(define-data-var reserve-x uint u0)
(define-data-var reserve-y uint u0)

;; private functions
;;
(define-private (update-reserve )
(let (
    (contract-address (as-contract tx-sender))
    (amount-x (unwrap! (contract-call? .dai-coin get-balances contract-address) err-get-dai-balances))
    (amount-y (unwrap! (contract-call? .wan-coin get-balances contract-address) err-get-wan-balances))
    ) 
    (asserts! (var-set reserve-x amount-x) err-set-reserve-x)
    (asserts! (var-set reserve-y amount-y) err-set-reserve-y)
    (ok true)
    )
)

;; public functions
;;
(define-public (add-liquidity (amount-x uint) (amount-y uint)) 
(let (
    (balance-x (var-get reserve-x))
    (balance-y (var-get reserve-y))
    (total-shares (unwrap! (get-total-liquidity) err-get-total-liquidity))
    (new-amount-y (if (is-eq balance-x u0) amount-y (/ (* amount-x balance-y) balance-x)))
    (add-shares (if (is-eq total-shares u0)
        (sqrti (* new-amount-y amount-x))
        (/ (* amount-x total-shares) balance-x)
    ))
    (contract-address (as-contract tx-sender))
    ) 
    (unwrap! (contract-call? .dai-coin transfer amount-x tx-sender contract-address none)  err-ft-transfer)
    (unwrap! (contract-call? .wan-coin transfer amount-y tx-sender contract-address none)  err-ft-transfer)
    (unwrap! (contract-call? .wei-coin mint add-shares tx-sender) err-wei-coin-mint)
    (try! (update-reserve))
    (ok true)
    )
)

(define-public (remove-liquidity (shares uint)) 
(let (
    (balance-x (var-get reserve-x))
    (balance-y (var-get reserve-y))
    (total-shares (unwrap! (get-total-liquidity) err-get-total-liquidity))
    ) 
    (asserts! (> shares u0) err-shares-less-than-zero)
    (asserts! (>= total-shares shares) err-total-shares-not-enough)
    (let (
        (amount-x (/ (* shares balance-x) total-shares))
        (amount-y (/ (* shares balance-y) total-shares))
        (receiver tx-sender)
        ) 
        (asserts! (and (> amount-x u0) (> amount-y u0)) err-invalid-withdraw-amount)
        (print amount-x)
        (print amount-y)
        (unwrap! 
            (contract-call? .wei-coin burn shares tx-sender) 
            err-wei-coin-burn)
        (unwrap! 
            (as-contract (contract-call? .dai-coin transfer amount-x tx-sender receiver none))
            err-ft-transfer)
        (unwrap! 
            (as-contract (contract-call? .wan-coin transfer amount-y tx-sender receiver none))
            err-ft-transfer)
        )
    (try! (update-reserve))
    (ok true)
    )
)

(define-public (swap (coin-in <ft-trait>) (amount-in uint)) 
(let (
    (coin-in-address (contract-of coin-in))
    (balance-x (var-get reserve-x))
    (balance-y (var-get reserve-y))
    (is-coin-x (if (is-eq coin-x coin-in-address) true false))
    (coin-out-address (if is-coin-x coin-y coin-x))
    (balance-in (if is-coin-x balance-x balance-y))
    (balance-out (if is-coin-x balance-y balance-x))
    (amount-in-with-fee (/ (* amount-in u997) u1000))
    (amount-out (/ (* balance-out amount-in-with-fee) (+ balance-in amount-in-with-fee)))
    (receiver tx-sender)
    (contract-address (as-contract tx-sender))
    ) 
    (if is-coin-x 
        (begin 
            (unwrap! 
                (contract-call? .dai-coin transfer amount-in tx-sender contract-address none)
            err-ft-transfer) 
            (unwrap! 
                (as-contract (contract-call? .wan-coin transfer amount-out tx-sender receiver none))
            err-ft-transfer))
        (begin 
            (unwrap! 
                (contract-call? .wan-coin transfer amount-in tx-sender contract-address none)
            err-ft-transfer) 
            (unwrap! 
                (as-contract (contract-call? .dai-coin transfer amount-out tx-sender receiver none))
            err-ft-transfer)))

    (try! (update-reserve))
    (ok {coin-out : coin-out-address, amount-out : amount-out})))

(define-read-only (get-total-liquidity) (contract-call? .wei-coin get-total-supply))

(define-read-only (get-reserve) 
(let (
    (balance-x (var-get reserve-x))
    (balance-y (var-get reserve-y))
) (ok {reserve-x : balance-x,reserve-y : balance-y}))
)